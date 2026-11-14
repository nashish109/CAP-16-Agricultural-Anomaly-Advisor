
package com.agrisense.service;

import com.agrisense.dto.FarmDto;
import com.agrisense.entity.Farm;
import com.agrisense.entity.Field;
import com.agrisense.entity.User;
import com.agrisense.exception.ConflictException;
import com.agrisense.exception.ResourceNotFoundException;
import com.agrisense.repository.FarmRepository;
import com.agrisense.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FarmService {

    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public FarmDto createFarm(FarmDto dto) {
        User currentUser = currentUserService.getCurrentUser();

        double areaAcres = AreaConverter.toCanonicalAcres(
                dto.getAreaAcres(),
                dto.getAreaValue(),
                dto.getAreaUnit()
        );

        Farm farm = new Farm();
        farm.setName(dto.getName());
        farm.setLocation(dto.getLocation());
        farm.setAreaAcres(areaAcres);
        farm.setUser(currentUser);

        return toDto(farmRepository.save(farm));
    }

    @Transactional
    public FarmDto updateFarm(Long farmId, FarmDto dto) {
        User currentUser = currentUserService.getCurrentUser();
        Farm farm = getOwnedFarm(farmId, currentUser);

        double newAreaAcres = AreaConverter.toCanonicalAcres(
                dto.getAreaAcres(),
                dto.getAreaValue(),
                dto.getAreaUnit()
        );

        List<Field> fields = fieldRepository.findByFarmId(farmId);

        double allocatedArea = fields.stream()
                .mapToDouble(Field::getAreaAcres)
                .sum();

        if (newAreaAcres < allocatedArea) {
            throw new ConflictException(
                    "Farm area cannot be smaller than the total allocated plot area."
            );
        }

        farm.setName(dto.getName());
        farm.setLocation(dto.getLocation());
        farm.setAreaAcres(newAreaAcres);

        return toDto(farmRepository.save(farm));
    }

    @Transactional(readOnly = true)
    public List<FarmDto> getAllFarms() {
        User currentUser = currentUserService.getCurrentUser();

        List<Farm> farms;

        if (isFarmer(currentUser)) {
            farms = farmRepository.findByUserId(currentUser.getId());
        } else {
            farms = farmRepository.findAll();
        }

        return farms.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FarmDto getFarmById(Long farmId) {
        User currentUser = currentUserService.getCurrentUser();

        Farm farm = isFarmer(currentUser)
                ? getOwnedFarm(farmId, currentUser)
                : farmRepository.findById(farmId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Farm not found"));

        return toDto(farm);
    }

    @Transactional
    public void deleteFarm(Long farmId) {
        User currentUser = currentUserService.getCurrentUser();
        Farm farm = getOwnedFarm(farmId, currentUser);

        List<Field> fields = fieldRepository.findByFarmId(farmId);

        if (!fields.isEmpty()) {
            throw new ConflictException(
                    "Cannot delete a farm while plots are attached to it."
            );
        }

        farmRepository.delete(farm);
    }

    private Farm getOwnedFarm(Long farmId, User user) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Farm not found"));

        if (!Objects.equals(farm.getUser().getId(), user.getId())) {
            throw new ResourceNotFoundException("Farm not found");
        }

        return farm;
    }

    private boolean isFarmer(User user) {
        return user.getRole() == com.agrisense.entity.Role.FARMER;
    }

    private FarmDto toDto(Farm farm) {
        FarmDto dto = new FarmDto();

        dto.setId(farm.getId());
        dto.setName(farm.getName());
        dto.setLocation(farm.getLocation());
        dto.setAreaAcres(farm.getAreaAcres());
        dto.setAreaHectares(
                AreaConverter.toHectares(farm.getAreaAcres())
        );

        return dto;
    }
}
